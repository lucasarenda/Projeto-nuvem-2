package br.com.nuvem.doacoes.doador;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DoadorRequest(
        @NotBlank(message = "Informe o nome") @Size(max = 150) String nome,
        @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") @Size(max = 150) String email,
        @Size(max = 20) String telefone,
        @Size(max = 100) String cidade,
        @Pattern(regexp = "^$|[A-Za-z]{2}", message = "UF com 2 letras") String uf,
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude) {
}
