# Stage-jobb för Svenskt översättarlexikon: grenen sol2 på sol-stage.pub.lb.se.
#
# Samma bild, nät och hälsokontroll som produktionsjobbet i sol-frontend.nomad,
# men en replik, port 3036 och en egen Consul-tjänst, så att båda kan köra på
# samma noder. Appen läser lexikonet ur Directus (Nomad-jobbet filisol) och
# fritextsöket ur OpenSearch via sina egna serverrutter under /api/sol.
#
# Bygg bilden med docker-builder-multiarch från grenens commit och lås
# digesten här. När stage är godkänd flyttas digesten till sol-frontend.nomad.
variable "image" {
  type    = string
  default = "registry.service.consul:5000/sol-frontend@sha256:4f416a76b4bc52e756a73557425df6c407755634b65ec354d1daa32720c32593"
}

job "sol-frontend-stage" {
  datacenters = ["local"]
  type        = "service"

  constraint {
    attribute = "${attr.cpu.arch}"
    value     = "amd64"
  }

  # OpenSearch-ingången lb-loadbalancer:9200 löses bara upp på noderna i
  # legacy-nätet (10.2.0.0/24), inte på molnklienterna.
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
    git_ref = "178960dacd82f73cfe4be4c2ac22a85b3e41fcc5"
    branch  = "sol2"
  }

  group "frontend" {
    count          = 1
    shutdown_delay = "10s"

    network {
      mode = "host"
      port "http" {
        static = 3036
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
      name     = "sol-frontend-stage"
      provider = "consul"
      address  = "${meta.bind_ip}"
      port     = "http"
      tags     = ["sol-frontend", "stage", "caddy-host=sol-stage.pub.lb.se", "caddy-ingress=public", "caddy-https=on", "caddy-noindex=on"]

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
        path     = "nomad/jobs/sol-frontend-stage/frontend/frontend"

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
        NODE_ENV          = "production"
        HOST              = "${meta.bind_ip}"
        PORT              = "${NOMAD_PORT_http}"
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
