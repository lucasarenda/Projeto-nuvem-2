package br.com.nuvem.doacoes.doador;

import java.time.Instant;

public record DoadorResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        String cidade,
        String uf,
        Double latitude,
        Double longitude,
        Instant criadoEm) {

    public static DoadorResponse de(Doador d) {
        return new DoadorResponse(d.getId(), d.getNome(), d.getEmail(), d.getTelefone(), d.getCidade(), d.getUf(),
                d.getLatitude(), d.getLongitude(), d.getCriadoEm());
    }
}
