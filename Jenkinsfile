pipeline {
    agent any

    environment {
        INVENTARIO_DB_PASSWORD = 'ClaveTemporalJenkins123'
        INVENTARIO_URL = 'http://docker.internal'
    }

    stages {
        stage('Preparar entorno') {
            steps {
                sh '''
                    echo "INVENTARIO_DB_PASSWORD=${INVENTARIO_DB_PASSWORD}" > .env
                    sed -i '/schema.sql/d' compose.yaml
                '''
            }
        }

        stage('Construir y levantar servicios') {
            steps {
                sh '''
                    docker compose up -d --build db
                    sleep 5
                    docker compose exec -T db psql -U postgres -d inventario_simple < database/schema.sql
                    docker compose up -d --wait
                '''
            }
        }

        stage('Ejecutar pruebas E2E') {
            steps {
                sh '''
                    docker run --rm \
                      --add-host=host.docker.internal:host-gateway \
                      -e INVENTARIO_URL=${INVENTARIO_URL} \
                      --volumes-from jenkins \
                      -w "$PWD" \
                      node:24-alpine \
                      node --test tests/inventario.test.mjs
                '''
            }
        }
    }

    post {
        always {
            sh 'docker compose down -v || true'
        }
    }
}
