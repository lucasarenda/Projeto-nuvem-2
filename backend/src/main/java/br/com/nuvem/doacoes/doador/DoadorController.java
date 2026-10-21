package br.com.nuvem.doacoes.doador;

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
@RequestMapping("/api/doadores")
public class DoadorController {

    private final DoadorService service;

    DoadorController(DoadorService service) {
        this.service = service;
    }

    /** Com {@code email}, devolve no máximo um doador (usado no fluxo "Quero doar"). */
    @GetMapping
    List<DoadorResponse> listar(@RequestParam(required = false) String termo,
                                @RequestParam(required = false) String email) {
        if (email != null && !email.isBlank()) {
            return service.buscarPorEmail(email).map(List::of).orElse(List.of());
        }
        return service.listar(termo);
    }

    @GetMapping("/{id}")
    DoadorResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    ResponseEntity<DoadorResponse> criar(@Valid @RequestBody DoadorRequest req) {
        DoadorResponse criado = service.criar(req);
        return ResponseEntity.created(URI.create("/api/doadores/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    DoadorResponse atualizar(@PathVariable Long id, @Valid @RequestBody DoadorRequest req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
