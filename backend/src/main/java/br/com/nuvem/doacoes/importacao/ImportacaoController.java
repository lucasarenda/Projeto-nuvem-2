package br.com.nuvem.doacoes.importacao;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import br.com.nuvem.doacoes.anexo.ArmazenamentoService;
import br.com.nuvem.doacoes.comum.RecursoNaoEncontradoException;
import br.com.nuvem.doacoes.comum.RegraNegocioException;
import br.com.nuvem.doacoes.importacao.Importacao.Status;
import br.com.nuvem.doacoes.ong.OngService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Importação de necessidades em lote (RF-02 + RF-03): o navegador envia o CSV
 * direto ao S3 em {@code importacoes/ong-{id}/...}; o evento do S3 dispara a
 * Lambda, que grava as necessidades no RDS e atualiza esta importação.
 */
@RestController
public class ImportacaoController {

    public record SolicitacaoImportacao(
            @NotBlank @Size(max = 255) String nomeArquivo,
            @Positive Long tamanhoBytes) {
    }

    public record ImportacaoAutorizada(Long importacaoId, String uploadUrl, String metodo, String contentType,
                                       String key, Instant expiraEm) {
    }

    public record ImportacaoResponse(Long id, Long ongId, String nomeArquivo, Status status, Integer linhasTotal,
                                     Integer linhasImportadas, Integer linhasComErro, String mensagens,
                                     Instant processadoEm, Instant criadoEm) {

        static ImportacaoResponse de(Importacao i) {
            return new ImportacaoResponse(i.getId(), i.getOng().getId(), i.getNomeArquivo(), i.getStatus(),
                    i.getLinhasTotal(), i.getLinhasImportadas(), i.getLinhasComErro(), i.getMensagens(),
                    i.getProcessadoEm(), i.getCriadoEm());
        }
    }

    private final ImportacaoRepository repository;
    private final OngService ongs;
    private final ArmazenamentoService armazenamento;

    ImportacaoController(ImportacaoRepository repository, OngService ongs, ArmazenamentoService armazenamento) {
        this.repository = repository;
        this.ongs = ongs;
        this.armazenamento = armazenamento;
    }

    @PostMapping("/api/ongs/{ongId}/importacoes")
    @Transactional
    ResponseEntity<ImportacaoAutorizada> autorizar(@PathVariable Long ongId,
                                                   @Valid @RequestBody SolicitacaoImportacao req) {
        if (!req.nomeArquivo().toLowerCase(Locale.ROOT).endsWith(".csv")) {
            throw new RegraNegocioException("Envie um arquivo .csv");
        }
        armazenamento.validarTamanho(req.tamanhoBytes());
        var ong = ongs.obter(ongId);
        var url = armazenamento.urlUpload(
                ArmazenamentoService.novaKey("importacoes/ong-" + ongId, req.nomeArquivo()), "text/csv");

        Importacao i = new Importacao();
        i.setOng(ong);
        i.setNomeArquivo(req.nomeArquivo());
        i.setS3Key(url.key());
        repository.save(i);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ImportacaoAutorizada(i.getId(), url.url(), "PUT", url.contentType(), url.key(), url.expiraEm()));
    }

    @GetMapping("/api/ongs/{ongId}/importacoes")
    @Transactional(readOnly = true)
    List<ImportacaoResponse> listar(@PathVariable Long ongId) {
        return repository.findByOngIdOrderByCriadoEmDesc(ongId).stream().map(ImportacaoResponse::de).toList();
    }

    @GetMapping("/api/importacoes/{id}")
    @Transactional(readOnly = true)
    ImportacaoResponse buscar(@PathVariable Long id) {
        return repository.findById(id).map(ImportacaoResponse::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Importação", id));
    }
}
