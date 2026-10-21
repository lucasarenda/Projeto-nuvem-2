package br.com.nuvem.doacoes.sugestao;

import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;

public record SugestaoResponse(
        Long necessidadeId,
        String titulo,
        String descricao,
        Categoria categoria,
        Urgencia urgencia,
        String unidade,
        int quantidade,
        int quantidadeRecebida,
        int faltam,
        Long ongId,
        String ongNome,
        String ongCidade,
        String ongUf,
        String ongEndereco,
        String ongLogoUrl,
        double ongLatitude,
        double ongLongitude,
        double distanciaKm,
        double pontuacao,
        boolean melhorMatch,
        String motivo) {
}
