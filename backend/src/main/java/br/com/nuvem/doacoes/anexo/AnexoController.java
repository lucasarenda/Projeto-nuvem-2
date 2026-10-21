package br.com.nuvem.doacoes.anexo;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nuvem.doacoes.anexo.Anexo.EntidadeTipo;
import br.com.nuvem.doacoes.anexo.AnexoDtos.AnexoResponse;
import br.com.nuvem.doacoes.anexo.AnexoDtos.SolicitacaoLogo;
import br.com.nuvem.doacoes.anexo.AnexoDtos.SolicitacaoUpload;
import br.com.nuvem.doacoes.anexo.AnexoDtos.UploadAutorizado;
import jakarta.validation.Valid;

@RestController
public class AnexoController {

    private final AnexoService service;

    AnexoController(AnexoService service) {
        this.service = service;
    }

    /** Passo 1 do upload (RF-02): gera a URL pré-assinada. Passo 2 é o PUT do navegador direto no S3. */
    @PostMapping("/api/anexos/upload-url")
    ResponseEntity<UploadAutorizado> autorizar(@Valid @RequestBody SolicitacaoUpload req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.autorizarUpload(req));
    }

    @PostMapping("/api/ongs/{ongId}/logo/upload-url")
    ResponseEntity<UploadAutorizado> autorizarLogo(@PathVariable Long ongId, @Valid @RequestBody SolicitacaoLogo req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.autorizarLogo(ongId, req));
    }

    @GetMapping("/api/anexos")
    List<AnexoResponse> listar(@RequestParam EntidadeTipo entidadeTipo, @RequestParam Long entidadeId) {
        return service.listar(entidadeTipo, entidadeId);
    }

    @GetMapping("/api/anexos/{id}")
    AnexoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @DeleteMapping("/api/anexos/{id}")
    ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
