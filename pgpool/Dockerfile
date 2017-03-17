FROM centos:7
MAINTAINER p.timmermans@evs.com
ENV MAJORVER=9.6
ENV MINORVER=2
ENV PGVER=96
ENV container docker
RUN yum update -y ; yum clean all
RUN yum install -y http://www.pgpool.net/yum/rpms/3.6/redhat/rhel-7-x86_64/pgpool-II-release-3.6-1.noarch.rpm; yum clean all
RUN yum install -y pgpool-II-pg${PGVER} pgpool-II-pg${PGVER}-extensions pgpool-II-pg${PGVER}-debuginfo sudo vi openssh openssh-clients iproute; yum clean all
RUN groupadd -g 50010 postgres && useradd -u 50010 -g postgres postgres 
RUN usermod -G wheel -a postgres && echo "postgres" | passwd --stdin postgres
RUN echo "Defaults:postgres !requiretty" > /etc/sudoers.d/postgres && \
    echo "postgres ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/postgres
RUN sed -i -e "s/^%wheel/#%wheel/" -e "/^#.*%wheel.*NOPASSWD/s/^#.*%wheel/%wheel/" /etc/sudoers
RUN echo root:postgres | chpasswd
# Make ssh connection easier
RUN echo "StrictHostKeyChecking no" >> /etc/ssh/ssh_config && \
    echo "UserKnownHostsFile /dev/null" >> /etc/ssh/ssh_config && \
    echo "LogLevel QUIET" >> /etc/ssh/ssh_config
ADD ssh_keys /home/postgres/.ssh 
RUN chown -R postgres:postgres /home/postgres/.ssh && chmod 700 /home/postgres/.ssh && chmod 644 /home/postgres/.ssh/* && chmod 600 /home/postgres/.ssh/id_rsa
RUN mkdir /var/run/postgresql && chown postgres:postgres /var/run/postgresql
RUN chown postgres:postgres /var/run/pgpool
ADD pool_hba.conf /etc/pgpool-II/
RUN echo "postgres:c40a332fdc07de0ff41f8460824c3756" >> /etc/pgpool-II/pcp.conf
RUN echo "*:*:postgres:evs123" > /home/postgres/.pcppass && chown postgres:postgres /home/postgres/.pcppass && chmod 600 /home/postgres/.pcppass
RUN chown -R postgres:postgres /etc/pgpool-II 
# scripts in /opt/cl-pg-utils should be installed by a rpm (TODO)
RUN mkdir /opt/cl-pg-utils
#ADD ./scripts /opt/cl-pg-utils/scripts
#ADD ./pgconfig /opt/cl-pg-utils/pgconfig
ADD ./lib /opt/cl-pg-utils/lib
ADD ./pgpool /opt/cl-pg-utils/pgpool
RUN chown -R postgres:postgres /opt/cl-pg-utils && chmod 750 /opt/cl-pg-utils && find /opt/cl-pg-utils -name "*.sh" -exec chmod +x {} \;
ADD bin/entrypoint.sh /
RUN chown postgres:postgres /entrypoint.sh && chmod +x /entrypoint.sh
EXPOSE 9999
USER postgres
CMD ["/entrypoint.sh"]
