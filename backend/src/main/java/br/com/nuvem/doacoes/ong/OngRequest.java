package br.com.nuvem.doacoes.ong;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OngRequest(
        @NotBlank(message = "Informe o nome") @Size(max = 150) String nome,
        @Pattern(regexp = "^$|\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}", message = "CNPJ no formato 00.000.000/0000-00") String cnpj,
        @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") @Size(max = 150) String email,
        @Size(max = 20) String telefone,
        @Size(max = 2000) String descricao,
        @Size(max = 255) String endereco,
        @NotBlank(message = "Informe a cidade") @Size(max = 100) String cidade,
        @NotBlank(message = "Informe a UF") @Pattern(regexp = "[A-Za-z]{2}", message = "UF com 2 letras") String uf,
        @NotNull(message = "Informe a latitude") @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @NotNull(message = "Informe a longitude") @DecimalMin("-180") @DecimalMax("180") Double longitude) {
}
