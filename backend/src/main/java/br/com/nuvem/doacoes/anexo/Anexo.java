package br.com.nuvem.doacoes.anexo;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Arquivo enviado ao S3 e ligado a uma ONG, necessidade ou doação.
 * Os campos de processamento (largura, altura, páginas, miniatura) são
 * preenchidos pela Lambda "processar-arquivo" disparada pelo S3.
 */
@Entity
@Table(name = "anexos")
public class Anexo {

    public enum EntidadeTipo { ONG, NECESSIDADE, DOACAO }

    public enum Status { AGUARDANDO_UPLOAD, PROCESSADO, ERRO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entidade_tipo", nullable = false, length = 20)
    private EntidadeTipo entidadeTipo;

    @Column(name = "entidade_id", nullable = false)
    private Long entidadeId;

    @Column(name = "nome_original", nullable = false)
    private String nomeOriginal;

    @Column(name = "s3_key", nullable = false, unique = true, length = 500)
    private String s3Key;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "tamanho_bytes")
    private Long tamanhoBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.AGUARDANDO_UPLOAD;

    private Integer largura;

    private Integer altura;

    private Integer paginas;

    @Column(name = "thumbnail_key", length = 500)
    private String thumbnailKey;

    @Column(length = 1000)
    private String erro;

    @Column(name = "processado_em")
    private Instant processadoEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @PrePersist
    void aoCriar() {
        criadoEm = Instant.now();
    }

    public Long getId() { return id; }
    public EntidadeTipo getEntidadeTipo() { return entidadeTipo; }
    public void setEntidadeTipo(EntidadeTipo entidadeTipo) { this.entidadeTipo = entidadeTipo; }
    public Long getEntidadeId() { return entidadeId; }
    public void setEntidadeId(Long entidadeId) { this.entidadeId = entidadeId; }
    public String getNomeOriginal() { return nomeOriginal; }
    public void setNomeOriginal(String nomeOriginal) { this.nomeOriginal = nomeOriginal; }
    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getTamanhoBytes() { return tamanhoBytes; }
    public void setTamanhoBytes(Long tamanhoBytes) { this.tamanhoBytes = tamanhoBytes; }
    public Status getStatus() { return status; }
    public Integer getLargura() { return largura; }
    public Integer getAltura() { return altura; }
    public Integer getPaginas() { return paginas; }
    public String getThumbnailKey() { return thumbnailKey; }
    public String getErro() { return erro; }
    public Instant getProcessadoEm() { return processadoEm; }
    public Instant getCriadoEm() { return criadoEm; }
}
