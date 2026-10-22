package br.com.nuvem.doacoes.comum;

import org.springframework.util.StringUtils;

public final class Textos {

    private Textos() {
    }

    public static String vazioParaNulo(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    /**
     * Filtro de busca textual: nunca devolve null. No PostgreSQL, um parâmetro null dentro de
     * concat()/lower() chega sem tipo (bytea) e quebra a consulta; por isso usamos "" para "sem filtro".
     */
    public static String filtroTexto(String s) {
        return StringUtils.hasText(s) ? s.trim() : "";
    }

    public static String ufOuNulo(String uf) {
        return StringUtils.hasText(uf) ? uf.trim().toUpperCase() : null;
    }
}
