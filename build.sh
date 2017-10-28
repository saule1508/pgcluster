VER=`cat version.txt`
# remove volumes so we start from scratch
docker volume ls | grep pgcluster | awk '{print $2}' | xargs docker volume rm
docker build -t pg:${VER} --no-cache=false -f postgres/Dockerfile.supervisor ./postgres
#if [ $? -eq 0 ] ; then
# echo pushing to local registry
# sudo docker tag pg:$VER localhost:5000/pg:$VER
# sudo docker push localhost:5000/pg:$VER
#fi
docker build -t pgpool:${VER} -f pgpool/Dockerfile ./pgpool
#if [ $? -eq 0 ] ; then
# echo pushing to local registry
# sudo docker tag pgpool:$VER localhost:5000/pgpool:$VER
# sudo docker push localhost:5000/pgpool:$VER
#fi
#TO do: add the manager
thisdir=$(pwd)
cd manager/build
./build.bash
cd $thisdir
