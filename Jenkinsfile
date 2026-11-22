pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 15, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  environment {
    // Nombre del proyecto Compose: aísla los contenedores y la red del pipeline
    COMPOSE_PROJECT_NAME = 'inventario-ci'
    // Puerto publicado del frontend en el host (compose.yaml lee ${FRONTEND_PORT:-8080})
    FRONTEND_PORT        = '8082'
    // Cliente de Docker Desktop visible para la cuenta LocalSystem
    PATH                 = "C:\\Program Files\\Docker\\Docker\\resources\\bin;${env.PATH}"
    // Si 'docker version' muestra Client pero no Server, descomenta esta línea:
    // DOCKER_HOST       = 'npipe:////./pipe/dockerDesktopLinuxEngine'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Diagnóstico') {
      steps {
        // returnStatus: true => se ejecutan todos los comandos aunque alguno falle
        bat(returnStatus: true, script: 'echo %PATH%')
        bat(returnStatus: true, script: 'dir "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"')
        bat(returnStatus: true, script: 'where docker')
        bat(returnStatus: true, script: 'docker version')
      }
    }

    stage('Preparar .env') {
      steps {
        // Credencial tipo "Secret text" con ID: inventario-db-password
        withCredentials([string(credentialsId: 'inventario-db-password', variable: 'DB_PASS')]) {
          bat 'copy /Y .env.example .env'
          powershell '''
            $lineas = Get-Content .env | ForEach-Object {
              if ($_ -match '^INVENTARIO_DB_PASSWORD=') { "INVENTARIO_DB_PASSWORD=$env:DB_PASS" } else { $_ }
            }
            Set-Content -Path .env -Value $lineas -Encoding ascii
          '''
        }
      }
    }

    stage('Construir y levantar servicios') {
      steps {
        bat 'docker compose up -d --build --wait'
        bat 'docker compose ps'
      }
    }

    stage('Prueba automatizada') {
      steps {
        // La prueba corre en un contenedor Node 24 dentro de la red de Compose,
        // así no hace falta Node.js instalado en el equipo.
        bat '''
          docker rm -f inventario-test 2>nul
          docker create --name inventario-test --network inventario-ci_default -e INVENTARIO_URL=http://frontend:8080 -w / node:24-alpine node --test /tests/inventario.test.mjs
          docker cp tests inventario-test:/tests
          docker start -a inventario-test
        '''
      }
    }
  }

  post {
    always {
      // Diagnóstico y limpieza: no deben hacer fallar el build
      bat(returnStatus: true, script: 'docker compose logs --no-color')
      bat(returnStatus: true, script: 'docker rm -f inventario-test')
      bat(returnStatus: true, script: 'docker compose down -v')
      bat(returnStatus: true, script: 'if exist .env del .env')
    }
    success {
      echo 'Pipeline completado: la prueba de integración pasó.'
    }
    failure {
      echo 'Pipeline fallido: revisa los logs arriba.'
    }
  }
}
