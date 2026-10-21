package br.com.nuvem.doacoes.anexo;

import java.time.Instant;

import br.com.nuvem.doacoes.anexo.Anexo.EntidadeTipo;
import br.com.nuvem.doacoes.anexo.Anexo.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class AnexoDtos {

    private AnexoDtos() {
    }

    public record SolicitacaoUpload(
            @NotNull(message = "Informe o tipo da entidade") EntidadeTipo entidadeTipo,
            @NotNull(message = "Informe o id da entidade") Long entidadeId,
            @NotBlank(message = "Informe o nome do arquivo") @Size(max = 255) String nomeArquivo,
            @NotBlank(message = "Informe o tipo do arquivo") String contentType,
            @Positive Long tamanhoBytes) {
    }

    public record SolicitacaoLogo(
            @NotBlank @Size(max = 255) String nomeArquivo,
            @NotBlank String contentType,
            @Positive Long tamanhoBytes) {
    }

    /** O front faz {@code PUT uploadUrl} com o header {@code Content-Type: contentType}. */
    public record UploadAutorizado(
            Long anexoId,
            String uploadUrl,
            String metodo,
            String contentType,
            String key,
            Instant expiraEm) {
    }

    public record AnexoResponse(
            Long id,
            EntidadeTipo entidadeTipo,
            Long entidadeId,
            String nomeOriginal,
            String contentType,
            Long tamanhoBytes,
            Status status,
            Integer largura,
            Integer altura,
            Integer paginas,
            String url,
            String thumbnailUrl,
            String erro,
            Instant processadoEm,
            Instant criadoEm) {
    }
}
