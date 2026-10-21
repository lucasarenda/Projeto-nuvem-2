package br.com.nuvem.doacoes.anexo;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import br.com.nuvem.doacoes.comum.RegraNegocioException;
import br.com.nuvem.doacoes.config.S3Properties;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Tudo que fala com o S3 passa por aqui. O backend nunca recebe o arquivo:
 * ele só gera URLs pré-assinadas (PUT para enviar, GET para exibir) e o
 * navegador conversa direto com o bucket, que continua privado.
 */
@Service
public class ArmazenamentoService {

    private static final Logger log = LoggerFactory.getLogger(ArmazenamentoService.class);

    private final S3Properties props;
    private final ObjectProvider<S3Presigner> presigner;
    private final ObjectProvider<S3Client> s3;

    ArmazenamentoService(S3Properties props, ObjectProvider<S3Presigner> presigner, ObjectProvider<S3Client> s3) {
        this.props = props;
        this.presigner = presigner;
        this.s3 = s3;
    }

    public record UrlUpload(String url, String key, String contentType, Instant expiraEm) {
    }

    public UrlUpload urlUpload(String key, String contentType) {
        exigirBucket();
        var request = presigner.getObject().presignPutObject(p -> p
                .signatureDuration(props.uploadUrlTtl())
                .putObjectRequest(o -> o.bucket(props.bucket()).key(key).contentType(contentType)));
        return new UrlUpload(request.url().toString(), key, contentType, request.expiration());
    }

    /** URL temporária para exibir o objeto; {@code null} se não houver chave ou S3 não estiver configurado. */
    public String urlDownload(String key) {
        if (!StringUtils.hasText(key) || !StringUtils.hasText(props.bucket())) {
            return null;
        }
        try {
            return presigner.getObject().presignGetObject(p -> p
                            .signatureDuration(props.downloadUrlTtl())
                            .getObjectRequest(o -> o.bucket(props.bucket()).key(key)))
                    .url().toString();
        } catch (RuntimeException e) {
            log.warn("Não foi possível pré-assinar GET para {}: {}", key, e.getMessage());
            return null;
        }
    }

    public void remover(String key) {
        if (!StringUtils.hasText(key) || !StringUtils.hasText(props.bucket())) {
            return;
        }
        try {
            s3.getObject().deleteObject(d -> d.bucket(props.bucket()).key(key));
        } catch (RuntimeException e) {
            log.warn("Falha ao remover {} do S3: {}", key, e.getMessage());
        }
    }

    public void validarTamanho(Long tamanhoBytes) {
        if (tamanhoBytes != null && tamanhoBytes > props.maxUploadBytes()) {
            throw new RegraNegocioException("Arquivo maior que o limite de %d MB."
                    .formatted(props.maxUploadBytes() / (1024 * 1024)));
        }
    }

    public static String novaKey(String prefixo, String nomeArquivo) {
        return prefixo + "/" + UUID.randomUUID() + "-" + sanitizar(nomeArquivo);
    }

    static String sanitizar(String nome) {
        String semAcento = Normalizer.normalize(nome == null ? "arquivo" : nome, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String limpo = semAcento.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]+", "-").replaceAll("-{2,}", "-");
        limpo = limpo.replaceAll("^-|-$", "");
        if (limpo.isEmpty()) {
            limpo = "arquivo";
        }
        return limpo.length() > 80 ? limpo.substring(limpo.length() - 80) : limpo;
    }

    private void exigirBucket() {
        if (!StringUtils.hasText(props.bucket())) {
            throw new RegraNegocioException("Upload indisponível: variável S3_BUCKET não configurada no servidor.");
        }
    }
}
