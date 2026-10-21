package br.com.nuvem.doacoes.necessidade;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "necessidades")
public class Necessidade {

    public enum Categoria { ALIMENTO, ROUPA, CALCADO, HIGIENE, COBERTOR, BRINQUEDO, OUTRO }

    public enum Urgencia {
        BAIXA(1.0), MEDIA(1.35), ALTA(1.8);

        /** Peso usado no ranking de sugestões: urgência alta "aproxima" a ONG. */
        public final double peso;

        Urgencia(double peso) {
            this.peso = peso;
        }
    }

    public enum Status { ABERTA, ATENDIDA, CANCELADA }

    public enum Origem { MANUAL, CSV }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ong_id", nullable = false)
    private Ong ong;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(length = 2000)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Categoria categoria;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "quantidade_recebida", nullable = false)
    private Integer quantidadeRecebida = 0;

    @Column(nullable = false, length = 20)
    private String unidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Urgencia urgencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Status status = Status.ABERTA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Origem origem = Origem.MANUAL;

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

    public int getFaltam() {
        return Math.max(0, quantidade - quantidadeRecebida);
    }

    /** Registra itens entregues e fecha a necessidade quando a meta é atingida. */
    public void registrarRecebimento(int qtd) {
        quantidadeRecebida += qtd;
        if (status == Status.ABERTA && quantidadeRecebida >= quantidade) {
            status = Status.ATENDIDA;
        }
    }

    public void estornarRecebimento(int qtd) {
        quantidadeRecebida = Math.max(0, quantidadeRecebida - qtd);
        if (status == Status.ATENDIDA && quantidadeRecebida < quantidade) {
            status = Status.ABERTA;
        }
    }

    public Long getId() { return id; }
    public Ong getOng() { return ong; }
    public void setOng(Ong ong) { this.ong = ong; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
    public Integer getQuantidade() { return quantidade; }
    public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    public Integer getQuantidadeRecebida() { return quantidadeRecebida; }
    public void setQuantidadeRecebida(Integer quantidadeRecebida) { this.quantidadeRecebida = quantidadeRecebida; }
    public String getUnidade() { return unidade; }
    public void setUnidade(String unidade) { this.unidade = unidade; }
    public Urgencia getUrgencia() { return urgencia; }
    public void setUrgencia(Urgencia urgencia) { this.urgencia = urgencia; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Origem getOrigem() { return origem; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
}
