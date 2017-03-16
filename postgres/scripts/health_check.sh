#!/bin/bash

su - postgres -c "psql -c \"select current_timestamp ;\""
exit $?
