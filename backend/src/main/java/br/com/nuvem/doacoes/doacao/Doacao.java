package br.com.nuvem.doacoes.doacao;

import java.math.BigDecimal;
import java.time.Instant;

import br.com.nuvem.doacoes.doador.Doador;
import br.com.nuvem.doacoes.necessidade.Necessidade;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "doacoes")
public class Doacao {

    public enum Status {
        PENDENTE, CONFIRMADA, ENTREGUE, CANCELADA;

        public boolean podeIrPara(Status destino) {
            return switch (this) {
                case PENDENTE -> destino == CONFIRMADA || destino == ENTREGUE || destino == CANCELADA;
                case CONFIRMADA -> destino == ENTREGUE || destino == CANCELADA || destino == PENDENTE;
                case ENTREGUE, CANCELADA -> false;
            };
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doador_id", nullable = false)
    private Doador doador;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "necessidade_id", nullable = false)
    private Necessidade necessidade;

    @Column(nullable = false, length = 500)
    private String descricao;

    @Column(nullable = false)
    private Integer quantidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Status status = Status.PENDENTE;

    @Column(name = "distancia_km", precision = 8, scale = 2)
    private BigDecimal distanciaKm;

    @Column(length = 1000)
    private String observacao;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    @PrePersist
    void aoCriar() {
        criadoEm = atualizadoEm = Instant.now();
    }

    @PreUpdate
    void aoAtualizar() {
        atualizadoEm = Instant.now();
    }

    public Long getId() { return id; }
    public Doador getDoador() { return doador; }
    public void setDoador(Doador doador) { this.doador = doador; }
    public Necessidade getNecessidade() { return necessidade; }
    public void setNecessidade(Necessidade necessidade) { this.necessidade = necessidade; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public BigDecimal getDistanciaKm() { return distanciaKm; }
    public void setDistanciaKm(BigDecimal distanciaKm) { this.distanciaKm = distanciaKm; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
}
