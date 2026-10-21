package br.com.nuvem.doacoes.doacao;

import br.com.nuvem.doacoes.doacao.Doacao.Status;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StatusDoacaoRequest(
        @NotNull(message = "Informe o novo status") Status status,
        @Size(max = 1000) String observacao) {
}
