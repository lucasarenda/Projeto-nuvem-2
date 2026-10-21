package br.com.nuvem.doacoes.necessidade;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import br.com.nuvem.doacoes.necessidade.Necessidade.Status;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/necessidades")
public class NecessidadeController {

    private final NecessidadeService service;

    NecessidadeController(NecessidadeService service) {
        this.service = service;
    }

    @GetMapping
    List<NecessidadeResponse> listar(@RequestParam(required = false) Long ongId,
                                     @RequestParam(required = false) Categoria categoria,
                                     @RequestParam(required = false) Urgencia urgencia,
                                     @RequestParam(required = false) Status status,
                                     @RequestParam(required = false) String uf,
                                     @RequestParam(required = false) String termo) {
        return service.listar(ongId, categoria, urgencia, status, uf, termo);
    }

    @GetMapping("/{id}")
    NecessidadeResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    ResponseEntity<NecessidadeResponse> criar(@Valid @RequestBody NecessidadeRequest req) {
        NecessidadeResponse criada = service.criar(req);
        return ResponseEntity.created(URI.create("/api/necessidades/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    NecessidadeResponse atualizar(@PathVariable Long id, @Valid @RequestBody NecessidadeRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
