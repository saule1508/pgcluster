FROM centos:7
MAINTAINER p.timmermans@evs.com
ENV MAJORVER=10
ENV MINORVER=5
ENV PGVER=10
ENV REPMGRVER=4.2.0
ENV PGPOOLMAJOR=4.0
ENV PGPOOLVER=4.0.3
ENV docker=yes
RUN yum update -y ; yum clean all && rm -rf /var/yum/cache
RUN yum install -y epel-release libxslt sudo openssh-server openssh-clients jq passwd rsync && \
    yum install -y systemd-sysv iproute python-setuptools hostname inotify-tools yum-utils which && \
    yum clean all && rm -rf /var/yum/cache
RUN easy_install supervisor
RUN mkdir /var/run/sshd
RUN ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -N ''
RUN useradd -u 50010 postgres
RUN yum install -y https://download.postgresql.org/pub/repos/yum/10/redhat/rhel-7-x86_64/pgdg-centos10-10-2.noarch.rpm
RUN yum install -y postgresql${MAJORVER} postgresql${MAJORVER}-server  postgresql${MAJORVER}-contrib ; yum clean all
RUN yum install -y http://www.pgpool.net/yum/rpms/${PGPOOLMAJOR}/redhat/rhel-7-x86_64/pgpool-II-release-${PGPOOLMAJOR}-1.noarch.rpm
# pgpool extensions
RUN yum install -y pgpool-II-pg${MAJORVER}-${PGPOOLVER} pgpool-II-pg${MAJORVER}-extensions-${PGPOOLVER}; yum clean all; rm -rf /var/cache/yum
# repmgr: installed from 2ndquadrant repo will install repmgr4
#RUN curl https://dl.2ndquadrant.com/default/release/get/10/rpm | bash
#RUN yum install --enablerepo=2ndquadrant-dl-default-release-pg10 --disablerepo=pgdg10 -y repmgr10-${REPMGRVER} && yum clean all && rm -rf /var/cache/yum
RUN yum install -y repmgr10-${REPMGRVER} && yum clean all && rm -rf /var/cache/yum
RUN chown postgres:postgres /var/log/repmgr
RUN mkdir -p /u01/pg${PGVER}/data /u02/backup /u02/archive && chown -R postgres:postgres /u01/pg${PGVER} /u02/backup /u02/archive && chmod 700 /u01/pg${PGVER}/data /u02/archive
ENV PGDATA /u01/pg${PGVER}/data
ENV PATH=$PATH:/usr/pgsql-${MAJORVER}/bin
ENV LANG=en_US.UTF-8
RUN usermod -G wheel -a postgres 
RUN echo "Defaults:postgres !requiretty" > /etc/sudoers.d/postgres && \
    echo "postgres ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/postgres
RUN sed -i -e "s/^%wheel/#%wheel/" -e "/^#.*%wheel.*NOPASSWD/s/^#.*%wheel/%wheel/" /etc/sudoers
RUN echo postgres:postgres | chpasswd
RUN echo root:postgres | chpasswd
# .bashrc is needed for connections via ssh
RUN  echo "export PATH=\$PATH:/usr/pgsql-${MAJORVER}/bin" >  /etc/profile.d/postgres.sh
RUN  echo "[ -f /etc/profile ] && source /etc/profile" >> /home/postgres/.bashrc && \
     echo "export PGDATA=/u01/pg${PGVER}/data PGVER=${PGVER} " >> /home/postgres/.bashrc
#Some useful aliases for replication
RUN echo "alias pool_nodes='psql --username=repmgr -h pgpool -p 9999 repmgr -c \"show pool_nodes;\"'" >> /home/postgres/.bashrc && \
    echo "alias cluster_show='repmgr -f /etc/repmgr/${MAJORVER}/repmgr.conf cluster show'" >> /home/postgres/.bashrc && \
    echo "alias cluster_monitor='psql --username=repmgr repmgr -c \"select * from repl_monitor order by last_monitor_time desc limit 1;\"'" >> /home/postgres/.bashrc
#
# this localedef command is needed because of bug in centos docker image?
#
RUN localedef -i en_US -f UTF-8 en_US.UTF-8
RUN echo "*:*:postgres:postgres" > /home/postgres/.pcppass && chown postgres:postgres /home/postgres/.pcppass && chmod 600 /home/postgres/.pcppass
ADD scripts /scripts
ADD pgconfig /opt/pgconfig
RUN chown -R postgres:postgres /scripts 
ADD ./bin/entrypoint.supervisor /entrypoint.sh
RUN chmod +x /entrypoint.sh
ADD get_master.sh /home/postgres/get_master.sh
RUN chown postgres:postgres /home/postgres/get_master.sh && chmod 750 /home/postgres/get_master.sh
ADD supervisord.conf /etc/supervisor/supervisord.conf
# Make ssh connection easier
RUN echo "StrictHostKeyChecking no" >> /etc/ssh/ssh_config && \
    echo "UserKnownHostsFile /dev/null" >> /etc/ssh/ssh_config && \
    echo "LogLevel QUIET" >> /etc/ssh/ssh_config
# ssh listen on port 222
RUN sed -i -e "s/^#Port 22/Port 222/" /etc/ssh/sshd_config
ADD ssh_keys /home/postgres/.ssh 
RUN chown -R postgres:postgres /home/postgres/.ssh && chmod 700 /home/postgres/.ssh && chmod 644 /home/postgres/.ssh/* && chmod 600 /home/postgres/.ssh/id_rsa
ENV PATH=$PATH:/usr/pgsql-${MAJORVER}/bin
ADD initdb.sh /scripts/initdb.sh
EXPOSE 5432
EXPOSE 222
VOLUME ["/u01/pg${PGVER}/data","/u02/archive","/u02/backup"]
# if the file $PGDATA/postgres.conf does not exist initdb will initialize the cluster and create db phoenix
#  and db users (two per microservice)
CMD ["/usr/bin/supervisord","--configuration=/etc/supervisor/supervisord.conf"]
#CMD ["tail","-f","/etc/supervisor/supervisord.conf"]
