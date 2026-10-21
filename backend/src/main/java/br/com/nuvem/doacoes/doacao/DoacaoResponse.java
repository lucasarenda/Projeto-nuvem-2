package br.com.nuvem.doacoes.doacao;

import java.math.BigDecimal;
import java.time.Instant;

import br.com.nuvem.doacoes.doacao.Doacao.Status;
import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;

public record DoacaoResponse(
        Long id,
        Long doadorId,
        String doadorNome,
        String doadorEmail,
        Long necessidadeId,
        String necessidadeTitulo,
        Categoria categoria,
        String unidade,
        Long ongId,
        String ongNome,
        String ongCidade,
        String ongUf,
        String descricao,
        int quantidade,
        Status status,
        BigDecimal distanciaKm,
        String observacao,
        Instant criadoEm,
        Instant atualizadoEm) {

    public static DoacaoResponse de(Doacao d) {
        var doador = d.getDoador();
        var n = d.getNecessidade();
        var o = n.getOng();
        return new DoacaoResponse(d.getId(), doador.getId(), doador.getNome(), doador.getEmail(),
                n.getId(), n.getTitulo(), n.getCategoria(), n.getUnidade(),
                o.getId(), o.getNome(), o.getCidade(), o.getUf(),
                d.getDescricao(), d.getQuantidade(), d.getStatus(), d.getDistanciaKm(), d.getObservacao(),
                d.getCriadoEm(), d.getAtualizadoEm());
    }
}
