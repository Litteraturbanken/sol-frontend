# Canonical Nomad job for Svenskt översättarlexikon.
# Deploy the digest-pinned image after validating and planning this file.
variable "image" {
  type    = string
  default = "10.0.0.50:5000/sol-frontend@sha256:4340920ebea9ce9e0a120297b4af151d91db785c5a8dec46ac23f6de149fdd38"
}

job "sol-frontend" {
  datacenters = ["local"]
  type        = "service"

  constraint {
    attribute = "${attr.cpu.arch}"
    value     = "amd64"
  }

  # Fritextsöket går via den interna OpenSearch-ingången lb-loadbalancer:9200,
  # som bara löses upp på noderna i legacy-nätet (10.2.0.0/24). Molnklienterna
  # (10.0.0.0/24) saknar det namnet.
  constraint {
    attribute = "${node.class}"
    operator  = "regexp"
    value     = "^(colocated|xl|nlp)$"
  }

  affinity {
    attribute = "${node.unique.name}"
    operator  = "="
    value     = "lb-nlp-c"
    weight    = -100
  }

  meta {
    source_sha256 = "4251e55439a34f24a6c0d6d7d98e230ec0a32b27db5b2e56b1937a6a2926d702"
  }

  group "frontend" {
    count          = 2
    shutdown_delay = "10s"

    constraint {
      distinct_hosts = true
    }

    network {
      mode = "host"
      port "http" {
        static = 3035
      }
    }

    update {
      max_parallel      = 1
      health_check      = "checks"
      min_healthy_time  = "20s"
      healthy_deadline  = "3m"
      progress_deadline = "5m"
      auto_revert       = true
    }

    restart {
      attempts = 3
      interval = "30m"
      delay    = "15s"
      mode     = "fail"
    }

    reschedule {
      delay          = "30s"
      delay_function = "exponential"
      max_delay      = "5m"
      unlimited      = true
    }

    service {
      name     = "sol-frontend"
      provider = "consul"
      address  = "${meta.bind_ip}"
      port     = "http"
      tags     = ["sol-frontend", "caddy-host=sol-frontend.pub.lb.se", "caddy-ingress=public", "caddy-https=on"]

      check {
        name     = "frontend-http"
        type     = "http"
        path     = "/%C3%B6vers%C3%A4ttarlexikon/favicon/favicon-32x32.png"
        interval = "10s"
        timeout  = "3s"
      }

      check_restart {
        limit = 3
        grace = "1m"
      }
    }

    task "frontend" {
      driver       = "docker"
      kill_timeout = "30s"

      # Directus-token från Nomad Variables, synkad från SOPS i lb-infra.
      # Item: directus_token, tillhör API-användaren sol-frontend@lb.se som
      # bara har läsrätt. Skapas om med scripts/directus-access.mjs.
      secret "runtime" {
        provider = "nomad"
        path     = "nomad/jobs/sol-frontend/frontend/frontend"

        config {
          namespace = "default"
        }
      }

      config {
        image        = var.image
        force_pull   = true
        network_mode = "host"
        ports        = ["http"]
      }

      env {
        NODE_ENV             = "production"
        HOST                 = "${meta.bind_ip}"
        PORT                 = "${NOMAD_PORT_http}"
        NUXT_APP_BASE_URL = "/översättarlexikon/"

        # Lexikonets data läses ur Directus (Nomad-jobbet filisol), fritextsöket
        # ur OpenSearch. Båda nås bara av serverlagret, och Directus nås på den
        # interna Consul-adressen så att anropen inte går via den publika
        # ingressen och dess passiva hälsokontroll. NUXT_PUBLIC_API_BASE lämnas
        # osatt så att sidorna använder appens egna rutter under /api/sol.
        NUXT_DIRECTUS_URL       = "http://filisol.service.consul:8055"
        NUXT_DIRECTUS_TOKEN     = "${secret.runtime.directus_token}"
        NUXT_OPENSEARCH_URL     = "http://lb-loadbalancer:9200"
        NUXT_OPENSEARCH_INDEX   = "littb-live_sol"
        NUXT_PUBLIC_ASSETS_BASE = "https://filisol.pub.lb.se/assets/"
      }

      resources {
        cpu        = 250
        memory     = 256
        memory_max = 512
      }

      logs {
        max_files     = 3
        max_file_size = 10
      }
    }
  }
}
