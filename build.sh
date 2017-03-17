VER=`cat version.txt`
docker volume ls | grep pgcluster | awk '{print $2}' | xargs docker volume rm
docker build -t pg:${VER} -f postgres/Dockerfile.supervisor ./postgres
if [ $? -eq 0 ] ; then
 echo pushing to local registry
 docker tag pg:$VER localhost:5000/pg:$VER
 docker push localhost:5000/pg:$VER
fi
docker build -t pgpool:${VER} -f pgpool/Dockerfile ./pgpool
if [ $? -eq 0 ] ; then
 echo pushing to local registry
 docker tag pgpool:$VER localhost:5000/pgpool:$VER
 docker push localhost:5000/pgpool:$VER
fi
