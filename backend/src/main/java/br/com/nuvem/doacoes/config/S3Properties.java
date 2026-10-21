package br.com.nuvem.doacoes.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.s3")
public record S3Properties(
        String bucket,
        String region,
        Duration uploadUrlTtl,
        Duration downloadUrlTtl,
        long maxUploadBytes) {
}
