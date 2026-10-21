package br.com.nuvem.doacoes.ong;

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

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ongs")
public class OngController {

    private final OngService service;

    OngController(OngService service) {
        this.service = service;
    }

    @GetMapping
    List<OngResponse> listar(@RequestParam(required = false) String termo,
                             @RequestParam(required = false) String uf) {
        return service.listar(termo, uf);
    }

    @GetMapping("/{id}")
    OngResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    ResponseEntity<OngResponse> criar(@Valid @RequestBody OngRequest req) {
        OngResponse criada = service.criar(req);
        return ResponseEntity.created(URI.create("/api/ongs/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    OngResponse atualizar(@PathVariable Long id, @Valid @RequestBody OngRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
