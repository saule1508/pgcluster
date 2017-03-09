FROM centos:7
MAINTAINER pierre@critiqueslibres.com
ENV MAJORVER=9.6
ENV MINORVER=2
ENV PGVER=96
ENV container docker
RUN yum update -y ; yum clean all
RUN yum install -y libxslt systemd-sysv sudo openssh-server openssh-clients passwd rsync; yum clean all
RUN mkdir /var/run/sshd
RUN ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -N ''
RUN (cd /lib/systemd/system/sysinit.target.wants/; for i in *; do [ $i == \
systemd-tmpfiles-setup.service ] || rm -f $i; done); \
(cd /lib/systemd/system/multi-user.target.wants/; for i in *; do [ $i == \
systemd-user-sessions.service ] || rm -f $i; done); \
rm -f /etc/systemd/system/*.wants/*;\
rm -f /lib/systemd/system/local-fs.target.wants/*; \
rm -f /lib/systemd/system/sockets.target.wants/*udev*; \
rm -f /lib/systemd/system/sockets.target.wants/*initctl*; \
rm -f /lib/systemd/system/basic.target.wants/*;\
rm -f /lib/systemd/system/anaconda.target.wants/*;
RUN systemctl enable sshd
ADD https://yum.postgresql.org/${MAJORVER}/redhat/rhel-7-x86_64/postgresql${PGVER}-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm /tmp
ADD https://yum.postgresql.org/${MAJORVER}/redhat/rhel-7-x86_64/postgresql${PGVER}-contrib-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm /tmp
ADD https://yum.postgresql.org/${MAJORVER}/redhat/rhel-7-x86_64/postgresql${PGVER}-libs-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm /tmp
ADD https://yum.postgresql.org/${MAJORVER}/redhat/rhel-7-x86_64/postgresql${PGVER}-server-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm /tmp
RUN useradd -u 50010 postgres
RUN rpm -i /tmp/postgresql${PGVER}-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm \
           /tmp/postgresql${PGVER}-contrib-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm \
           /tmp/postgresql${PGVER}-libs-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm \
           /tmp/postgresql${PGVER}-server-${MAJORVER}.${MINORVER}-1PGDG.rhel7.x86_64.rpm && \
	   rm -f /tmp/postgresql*.rpm
# install repmgr
ADD https://yum.postgresql.org/9.6/redhat/rhel-7-x86_64/repmgr96-3.3-1.rhel7.x86_64.rpm /tmp
RUN rpm -i /tmp/repmgr96-3.3-1.rhel7.x86_64.rpm ;  rm /tmp/repmgr96-3.3-1.rhel7.x86_64.rpm 
RUN echo "#replication manager" >> $PGDATA/pg_hba.conf && \
    echo "local    replication   repmgr                  trust" >> $PGDATA/pg_hba.conf && \
    echo "host     replication   repmgr  127.0.0.1/32    trust" >> $PGDATA/pg_hba.conf && \
    echo "host     replication   repmgr  172.18.0.0/16   trust" >> $PGDATA/pg_hba.conf && \
    echo "local    repmgr        repmgr                  trust" >> $PGDATA/pg_hba.conf && \
    echo "host     repmgr   repmgr       127.0.0.1/32    trust" >> $PGDATA/pg_hba.conf && \
    echo "host     repmgr   repmgr       172.18.0.0/16    trust" >> $PGDATA/pg_hba.conf 
ADD ./repmgr.conf /etc/repmgr/9.6/
RUN chown postgres:postgres /etc/repmgr/9.6/repmgr.conf 
RUN chown postgres:postgres /var/log/repmgr
RUN mkdir /etc/systemd/system/repmgr96.service.d
RUN echo "[Service]" > /etc/systemd/system/repmgr96.service.d/override.conf && \
    echo "ExecStart=" >> /etc/systemd/system/repmgr96.service.d/override.conf && \
    echo "ExecStart=/usr/pgsql-9.6/bin/repmgrd -f \${REPMGRDCONF} -p \${PIDFILE} -d --verbose --monitoring-history" >> /etc/systemd/system/repmgr96.service.d/override.conf 
RUN systemctl enable repmgr96
RUN mkdir -p /u01/pg${PGVER}/data /u02/backup /u02/archive && chown -R postgres:postgres /u01/pg${PGVER} /u02/backup /u02/archive && \
    chmod 700 /u01/pg${PGVER}/data /u02/archive
ENV PGDATA /u01/pg${PGVER}/data
ENV PATH=$PATH:/usr/pgsql-${MAJORVER}/bin
ENV LANG=en_US.UTF-8
RUN usermod -G wheel -a postgres 
RUN echo "Defaults:postgres !requiretty" > /etc/sudoers.d/postgres && \
    echo "postgres ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/postgres
RUN sed -i -e "s/^%wheel/#%wheel/" -e "/^#.*%wheel.*NOPASSWD/s/^#.*%wheel/%wheel/" /etc/sudoers
RUN echo postgres:postgres | chpasswd
RUN echo root:postgres | chpasswd
ADD ssh_keys /home/postgres/.ssh
RUN chown -R postgres:postgres /home/postgres/.ssh && chmod 700 /home/postgres/.ssh && chmod 644 /home/postgres/.ssh/* && chmod 600 /home/postgres/.ssh/id_rsa
#selinux inside the container is not possible, commands below only make sense on a host
#RUN semanage fcontext --add --type postgresql_exec_t "/usr/pgsql-9.6/bin/(initdb|postgres|pg_ctl)" && \
#    restorecon -rv /usr/pgsql-9.6/bin/* && \
#    semanage fcontext --add --type postgresql_db_t "/u01/pg96/data(/.*)?" && \
#    restorecon -rv --type=postgresql_db_t /u01/pg96/data
RUN  echo "export PATH=\$PATH:/usr/pgsql-${MAJORVER}/bin" >  /etc/profile.d/postgres.sh
RUN  echo "[ -f /etc/profile ] && source /etc/profile" >> /home/postgres/.bash_profile && \
     echo "export PGDATA=/u01/pg96/data" >> /home/postgres/.bash_profile
#Some useful aliases for replication
RUN echo "alias pool_nodes='psql --username=repmgr -h ##IPFAILOVER## -p 9999 repmgr -c \"show pool_nodes;\"'" >> /home/postgres/.bashrc && \
    echo "alias cluster_show='repmgr -f /etc/repmgr/9.6/repmgr.conf cluster show'" >> /home/postgres/.bashrc && \
    echo "alias cluster_monitor='psql --username=repmgr repmgr -c \"select * from repl_monitor order by last_monitor_time desc limit 1;\"'" >> /home/postgres/.bashrc
#
# this localedef command is needed because of bug in centos docker image?
#
RUN localedef -i en_US -f UTF-8 en_US.UTF-8
# scripts in /opt/cl-pg-utils should be installed by a rpm (TODO)
RUN mkdir /opt/cl-pg-utils
ADD ./scripts /opt/cl-pg-utils/scripts
ADD ./pgconfig /opt/cl-pg-utils/pgconfig
ADD ./lib /opt/cl-pg-utils/lib
ADD ./bin/entrypoint.sh /
ADD ./pgpool /opt/cl-pg-utils/pgpool
RUN chown -R postgres:postgres /opt/cl-pg-utils && chmod 750 /opt/cl-pg-utils
RUN mkdir /etc/systemd/system/postgresql-9.6.service.d
RUN echo "[Service]" > /etc/systemd/system/postgresql-9.6.service.d/override.conf && \
    echo "Environment=">> /etc/systemd/system/postgresql-9.6.service.d/override.conf && \
    echo "Environment=PGDATA=/u01/pg96/data" >> /etc/systemd/system/postgresql-9.6.service.d/override.conf 
#    echo ExecStartPre= >> /etc/systemd/system/postgresql-9.6.service.d/override.conf && \
#    echo ExecStartPre=/opt/evs-infra-pg-utils/scripts/initdb.sh >> /etc/systemd/system/postgresql-9.6.service.d/override.conf
#    echo Requires=initdb.service >> /etc/systemd/system/postgresql-9.6.service.d/override.conf && \
#   echo After=initdb.service >> /etc/systemd/system/postgresql-9.6.service.d/override.conf &&
# Make ssh connection easier
RUN echo "StrictHostKeyChecking no" >> /etc/ssh/ssh_config && \
    echo "UserKnownHostsFile /dev/null" >> /etc/ssh/ssh_config && \
    echo "LogLevel QUIET" >> /etc/ssh/ssh_config 
#pgpass
RUN echo "*:*:repmgr:repmgr:repmgrpwd" > /home/postgres/.pgpass && chmod 600 /home/postgres/.pgpass && chown postgres:postgres /home/postgres/.pgpass
RUN systemctl enable postgresql-9.6.service
ENV PATH=$PATH:/usr/pgsql-${MAJORVER}/bin
# if the file $PGDATA/postgres.conf does not exist initdb will initialize the cluster and create db phoenix
#  and db users (two per microservice)
EXPOSE 5432
EXPOSE 22
VOLUME ["/u01/pg${PGVER}/data","/u02/archive","/u02/backup"]
CMD ["/entrypoint.sh"]
VOLUME [ "/sys/fs/cgroup" ]
