FROM fluent/fluentd:edge-debian

USER root
RUN gem install fluent-plugin-elasticsearch

COPY fluent.conf /fluentd/etc/
