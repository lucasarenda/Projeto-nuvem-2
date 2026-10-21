package br.com.nuvem.doacoes.doacao;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nuvem.doacoes.doacao.Doacao.Status;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doacoes")
public class DoacaoController {

    private final DoacaoService service;

    DoacaoController(DoacaoService service) {
        this.service = service;
    }

    @GetMapping
    List<DoacaoResponse> listar(@RequestParam(required = false) Long doadorId,
                                @RequestParam(required = false) Long ongId,
                                @RequestParam(required = false) Long necessidadeId,
                                @RequestParam(required = false) Status status) {
        return service.listar(doadorId, ongId, necessidadeId, status);
    }

    @GetMapping("/{id}")
    DoacaoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    ResponseEntity<DoacaoResponse> criar(@Valid @RequestBody DoacaoRequest req) {
        DoacaoResponse criada = service.criar(req);
        return ResponseEntity.created(URI.create("/api/doacoes/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    DoacaoResponse atualizar(@PathVariable Long id, @Valid @RequestBody DoacaoRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/status")
    DoacaoResponse alterarStatus(@PathVariable Long id, @Valid @RequestBody StatusDoacaoRequest req) {
        return service.alterarStatus(id, req);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
