package br.com.nuvem.doacoes.comum;

import org.springframework.util.StringUtils;

public final class Textos {

    private Textos() {
    }

    public static String vazioParaNulo(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    public static String ufOuNulo(String uf) {
        return StringUtils.hasText(uf) ? uf.trim().toUpperCase() : null;
    }
}
