package br.com.nuvem.doacoes.necessidade;

import java.time.Instant;

import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import br.com.nuvem.doacoes.necessidade.Necessidade.Origem;
import br.com.nuvem.doacoes.necessidade.Necessidade.Status;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;

public record NecessidadeResponse(
        Long id,
        Long ongId,
        String ongNome,
        String ongCidade,
        String ongUf,
        String titulo,
        String descricao,
        Categoria categoria,
        int quantidade,
        int quantidadeRecebida,
        int faltam,
        String unidade,
        Urgencia urgencia,
        Status status,
        Origem origem,
        Instant criadoEm,
        Instant atualizadoEm) {

    public static NecessidadeResponse de(Necessidade n) {
        var o = n.getOng();
        return new NecessidadeResponse(n.getId(), o.getId(), o.getNome(), o.getCidade(), o.getUf(),
                n.getTitulo(), n.getDescricao(), n.getCategoria(), n.getQuantidade(), n.getQuantidadeRecebida(),
                n.getFaltam(), n.getUnidade(), n.getUrgencia(), n.getStatus(), n.getOrigem(),
                n.getCriadoEm(), n.getAtualizadoEm());
    }
}
