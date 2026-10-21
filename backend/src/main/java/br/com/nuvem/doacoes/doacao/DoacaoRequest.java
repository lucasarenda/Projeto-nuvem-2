package br.com.nuvem.doacoes.doacao;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DoacaoRequest(
        @NotNull(message = "Informe o doador") Long doadorId,
        @NotNull(message = "Escolha a necessidade") Long necessidadeId,
        @NotBlank(message = "Descreva o que vai doar") @Size(max = 500) String descricao,
        @NotNull(message = "Informe a quantidade") @Min(value = 1, message = "Mínimo 1") @Max(1_000_000) Integer quantidade,
        @Size(max = 1000) String observacao) {
}
