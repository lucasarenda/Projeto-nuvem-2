package br.com.nuvem.doacoes.comum;

public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String recurso, Object id) {
        super(recurso + " " + id + " não encontrado(a)");
    }
}
