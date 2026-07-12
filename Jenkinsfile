pipeline {
  agent any

  parameters {
    choice(
      name: 'ROLLBACK_TEST_MODE',
      choices: ['none', 'local', 'global'],
      description: 'Use "local" to force the host-level rollback or "global" to force the ALB rollback after deployment.'
    )
  }

  tools {
    nodejs 'node-26'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    ALB_DNS_NAME = "terraform-node-nginx-alb-1026713903.ap-south-1.elb.amazonaws.com"

    AWS_REGION = "ap-south-1"
    ECR_REPO_URL = "148768123658.dkr.ecr.ap-south-1.amazonaws.com/terraform-node-nginx-repo"
    ASG_NAME = "terraform-node-nginx-asg"
    APP_PORT = "3000"
    DOCKER_PLATFORM = "linux/amd64"

  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Resolve Config') {
      steps {
        script {
          def packageJson = readJSON file: 'package.json'
          env.APP_NAME = packageJson.name
          env.DEPLOY_PATH = "/var/www/${env.APP_NAME}"
          env.HEALTH_URL = "https://test.hikmahone.com/health"
        }
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Test') {
      steps {
        sh '''
          if npm run | grep -q "test"; then
            npm test
          else
            echo "No test script found, skipping"
          fi
        '''
      }
    }

    stage('Validate Syntax') {
      steps {
        sh '''
          node --check app.js
          node --check index.js
          node --check test/app.test.js
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          if npm run | grep -q "build"; then
            npm run build
          else
            echo "No build script found, skipping"
          fi
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          node index.js &
          APP_PID=$!

          cleanup() {
            kill $APP_PID >/dev/null 2>&1 || true
          }

          trap cleanup EXIT

          sleep 3
          curl -fsS http://127.0.0.1:3000/health >/dev/null
          curl -fsS http://127.0.0.1:3000/ | grep -q "Congratulations"
        '''
      }
    }

    stage('Login to ECR') {
      steps {
        withCredentials([
          string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
        ]) {
          sh '''
            aws ecr get-login-password --region ${AWS_REGION} \
              | docker login --username AWS --password-stdin ${ECR_REPO_URL}
          '''
        }
      }
    }

    stage('Docker Build And Push') {
      steps {
        sh '''
          docker build \
            --platform ${DOCKER_PLATFORM} \
            -t ${APP_NAME}:${BUILD_NUMBER} .

          docker tag ${APP_NAME}:${BUILD_NUMBER} ${ECR_REPO_URL}:${BUILD_NUMBER}
          docker tag ${APP_NAME}:${BUILD_NUMBER} ${ECR_REPO_URL}:latest

          docker push ${ECR_REPO_URL}:${BUILD_NUMBER}
          docker push ${ECR_REPO_URL}:latest
        '''
      }
    }

    stage('Deploy Image on Existing ASG Instances') {
      steps {
        withCredentials([
          string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
        ]) {
          sh '''
            set -e

            INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
              --auto-scaling-group-names "$ASG_NAME" \
              --region "$AWS_REGION" \
              --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService'].InstanceId" \
              --output text)

            echo "Deploying to instances: $INSTANCE_IDS"

            COMMAND_ID=$(aws ssm send-command \
              --region "$AWS_REGION" \
              --instance-ids $INSTANCE_IDS \
              --document-name "AWS-RunShellScript" \
              --comment "Deploy ${APP_NAME}:${BUILD_NUMBER}" \
              --parameters commands="[
                \\"set -e\\",
                \\"aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO_URL}\\",
                \\"docker pull ${ECR_REPO_URL}:${BUILD_NUMBER}\\",
                \\"docker stop ${APP_NAME} || true\\",
                \\"docker rm ${APP_NAME} || true\\",
                \\"docker run -d --name ${APP_NAME} --restart unless-stopped -p 127.0.0.1:${APP_PORT}:${APP_PORT} -e NODE_ENV=production -e PORT=${APP_PORT} ${ECR_REPO_URL}:${BUILD_NUMBER}\\",
                \\"docker image prune -f\\"
              ]" \
              --query "Command.CommandId" \
              --output text)

            echo "SSM command id: $COMMAND_ID"

            aws ssm wait command-executed \
              --region "$AWS_REGION" \
              --command-id "$COMMAND_ID" \
              --instance-id $(echo $INSTANCE_IDS | awk '{print $1}')
          '''
        }
      }
    }

    stage('Health Check Through ALB') {
      steps {
        sh '''
          for i in 1 2 3 4 5 6 7 8 9 10; do
            if curl -fsS ${HEALTH_URL}; then
              echo "Health check passed"
              exit 0
            fi

            echo "Health check failed, retrying..."
            sleep 10
          done

          exit 1
        '''
      }
    }
  }

  post {
    success {
      echo "Deployment successful"
    }

    failure {
      echo "Deployment failed"
    }
  }
}
