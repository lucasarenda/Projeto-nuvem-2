package br.com.nuvem.doacoes.necessidade;

import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import br.com.nuvem.doacoes.necessidade.Necessidade.Status;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NecessidadeRequest(
        @NotNull(message = "Informe a ONG") Long ongId,
        @NotBlank(message = "Informe o item") @Size(max = 150) String titulo,
        @Size(max = 2000) String descricao,
        @NotNull(message = "Escolha a categoria") Categoria categoria,
        @NotNull(message = "Informe a quantidade") @Min(value = 1, message = "Mínimo 1") @Max(1_000_000) Integer quantidade,
        @NotBlank(message = "Informe a unidade") @Size(max = 20) String unidade,
        @NotNull(message = "Escolha a urgência") Urgencia urgencia,
        Status status) {
}
