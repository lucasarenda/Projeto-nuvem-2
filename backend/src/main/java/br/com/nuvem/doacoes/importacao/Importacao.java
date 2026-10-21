package br.com.nuvem.doacoes.importacao;

import java.time.Instant;

import br.com.nuvem.doacoes.ong.Ong;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Importação de necessidades via CSV, processada pela Lambda "processar-arquivo". */
@Entity
@Table(name = "importacoes")
public class Importacao {

    public enum Status { AGUARDANDO_UPLOAD, CONCLUIDA, ERRO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ong_id", nullable = false)
    private Ong ong;

    @Column(name = "nome_arquivo", nullable = false)
    private String nomeArquivo;

    @Column(name = "s3_key", nullable = false, unique = true, length = 500)
    private String s3Key;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.AGUARDANDO_UPLOAD;

    @Column(name = "linhas_total")
    private Integer linhasTotal;

    @Column(name = "linhas_importadas")
    private Integer linhasImportadas;

    @Column(name = "linhas_com_erro")
    private Integer linhasComErro;

    @Column(length = 4000)
    private String mensagens;

    @Column(name = "processado_em")
    private Instant processadoEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @PrePersist
    void aoCriar() {
        criadoEm = Instant.now();
    }

    public Long getId() { return id; }
    public Ong getOng() { return ong; }
    public void setOng(Ong ong) { this.ong = ong; }
    public String getNomeArquivo() { return nomeArquivo; }
    public void setNomeArquivo(String nomeArquivo) { this.nomeArquivo = nomeArquivo; }
    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }
    public Status getStatus() { return status; }
    public Integer getLinhasTotal() { return linhasTotal; }
    public Integer getLinhasImportadas() { return linhasImportadas; }
    public Integer getLinhasComErro() { return linhasComErro; }
    public String getMensagens() { return mensagens; }
    public Instant getProcessadoEm() { return processadoEm; }
    public Instant getCriadoEm() { return criadoEm; }
}
