package br.com.nuvem.doacoes.ong;

import java.time.Instant;

public record OngResponse(
        Long id,
        String nome,
        String cnpj,
        String email,
        String telefone,
        String descricao,
        String endereco,
        String cidade,
        String uf,
        Double latitude,
        Double longitude,
        String logoUrl,
        long necessidadesAbertas,
        Instant criadoEm,
        Instant atualizadoEm) {
}
