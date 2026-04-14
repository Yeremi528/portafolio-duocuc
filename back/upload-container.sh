docker build -t go-security .          
docker tag go-security southamerica-west1-docker.pkg.dev/security-apt/microservices/security:latest

docker push southamerica-west1-docker.pkg.dev/security-apt/microservices/security:latest

