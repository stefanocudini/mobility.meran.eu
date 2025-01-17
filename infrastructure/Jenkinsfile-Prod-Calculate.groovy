pipeline {
    agent any

    environment {
        DOCKER_PROJECT_NAME = "odh-mentor-otp"
        DOCKER_IMAGE_OTP = '755952719952.dkr.ecr.eu-west-1.amazonaws.com/odh-mentor-otp-calculate-otp'
        DOCKER_TAG = "prod-calculate-$BUILD_NUMBER"

        EFS_FOLDER = "/opt/odh-mentor-otp-prod/"

        JAVA_MX = "16G"
        BUILD_GRAPH = "True"
        DOWNLOAD_DATA = "False"
        BACKUP_GRAPH = "True"
        GBFS_HOST = "https://gbfs.otp.opendatahub.bz.it"
        CARSHARING_HOST = "https://carsharing.otp.opendatahub.bz.it"
        PARKING_HOST = "https://parking.otp.opendatahub.bz.it"
        DRT_HOST = "https://drt.otp.opendatahub.bz.it"
        CHARGER_HOST = "https://charger.otp.opendatahub.bz.it"
        UPDATERS = "True"
        GTFS_FILE = "latestGTFS.zip"
        OTP_OFFICIAL = "False"
        GBFS_VERSION = 1
        GTFS_RT_URL = "https://efa.sta.bz.it/gtfs-r/"
        GTFS_FEED_ID = 1
        GEOCODER_BASEURL = "https://geocoder.otp.opendatahub.bz.it"
        PARKING_BASEURL = "https://parking.otp.opendatahub.bz.it"
        DRT_BASEURL = "https://drt.otp.opendatahub.bz.it"
        CHARGER_BASEURL = "https://charger.otp.opendatahub.bz.it"
        TRAFFIC_BASEURL = "https://traffic.otp.opendatahub.bz.it"
    }

    stages {
        stage('Configure') {
            steps {
                sh """
                    rm -f .env
                    cp dotenv.example .env
                    echo 'COMPOSE_PROJECT_NAME=${DOCKER_PROJECT_NAME}' > .env
                    echo 'DOCKER_IMAGE_OTP=${DOCKER_IMAGE_OTP}' >> .env
                    echo 'DOCKER_TAG=${DOCKER_TAG}' >> .env

                    echo 'EFS_FOLDER=${EFS_FOLDER}' >> .env

                    echo 'JAVA_MX=${JAVA_MX}' >> .env
                    echo 'BUILD_GRAPH=${BUILD_GRAPH}' >> .env
                    echo 'DOWNLOAD_DATA=${DOWNLOAD_DATA}' >> .env
                    echo 'BACKUP_GRAPH=${BACKUP_GRAPH}' >> .env
                    echo 'GTFS_FILE=${GTFS_FILE}' >> .env
                    echo 'UPDATERS=${UPDATERS}' >> .env
                    echo 'GBFS_HOST=${GBFS_HOST}' >> .env
                    echo 'CARSHARING_HOST=${CARSHARING_HOST}' >> .env
                    echo 'PARKING_HOST=${PARKING_HOST}' >> .env
                    echo 'DRT_HOST=${DRT_HOST}' >> .env
                    echo 'CHARGER_HOST=${CHARGER_HOST}' >> .env
                    echo 'OTP_OFFICIAL=${OTP_OFFICIAL}' >> .env
                    echo 'GBFS_VERSION="${GBFS_VERSION}"' >> .env
                    echo 'GTFS_RT_URL="${GTFS_RT_URL}"' >> .env
                    echo 'GTFS_FEED_ID="${GTFS_FEED_ID}"' >> .env

                    echo 'GEOCODER_BASEURL="${GEOCODER_BASEURL}"' >> .env
                    echo 'PARKING_BASEURL="${PARKING_BASEURL}"' >> .env
                    echo 'DRT_BASEURL="${DRT_BASEURL}"' >> .env
                    echo 'CHARGER_BASEURL="${CHARGER_BASEURL}"' >> .env
                    echo 'TRAFFIC_BASEURL="${TRAFFIC_BASEURL}"' >> .env
                """
            }
        }
        stage('Build') {
            steps {
                sh '''
                    aws ecr get-login --region eu-west-1 --no-include-email | bash
                    docker-compose --no-ansi -f infrastructure/docker-compose.build.calculate.yml build --pull
                    docker-compose --no-ansi -f infrastructure/docker-compose.build.calculate.yml push
                '''
            }
        }
        stage('Deploy') {
            steps {
               sshagent(['jenkins-ssh-key']) {
                    sh """
                        (cd infrastructure/ansible && ansible-galaxy install -f -r requirements.yml)
                        (cd infrastructure/ansible && ansible-playbook --limit=prod deploy.calculate.yml --extra-vars "release_name=${BUILD_NUMBER}" --extra-vars "stage=prod")
                    """
                }
            }
        }
    }
}
