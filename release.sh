git push origin
ssh lb-appserv-a <<HERE
cd sol-frontend
git pull
source ~/.nvm/nvm.sh
nvm use
BASE_URL="/%C3%B6vers%C3%A4ttarlexikon/" yarn build
sudo systemctl restart sol-frontend
journalctl -u sol-frontend -f
HERE
