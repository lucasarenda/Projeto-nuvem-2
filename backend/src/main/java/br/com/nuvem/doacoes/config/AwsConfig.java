package br.com.nuvem.doacoes.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Clientes AWS. As credenciais NUNCA ficam no código: em produção vêm do
 * Instance Profile da EC2 (LabInstanceProfile); localmente, de ~/.aws/credentials.
 */
@Configuration
@EnableConfigurationProperties(S3Properties.class)
public class AwsConfig {

    @Bean(destroyMethod = "close")
    @Lazy
    S3Presigner s3Presigner(S3Properties props) {
        return S3Presigner.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(DefaultCredentialsProvider.builder().build())
                .build();
    }

    @Bean(destroyMethod = "close")
    @Lazy
    S3Client s3Client(S3Properties props) {
        return S3Client.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(DefaultCredentialsProvider.builder().build())
                .httpClient(UrlConnectionHttpClient.create())
                .build();
    }
}
