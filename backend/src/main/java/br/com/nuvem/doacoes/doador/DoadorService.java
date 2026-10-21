package br.com.nuvem.doacoes.doador;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nuvem.doacoes.comum.RecursoNaoEncontradoException;
import br.com.nuvem.doacoes.comum.RegraNegocioException;
import br.com.nuvem.doacoes.comum.Textos;

@Service
public class DoadorService {

    private final DoadorRepository repository;

    DoadorService(DoadorRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DoadorResponse> listar(String termo) {
        return repository.buscar(Textos.vazioParaNulo(termo)).stream().map(DoadorResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public Optional<DoadorResponse> buscarPorEmail(String email) {
        return repository.findByEmailIgnoreCase(email.trim()).map(DoadorResponse::de);
    }

    @Transactional(readOnly = true)
    public DoadorResponse buscar(Long id) {
        return DoadorResponse.de(obter(id));
    }

    @Transactional
    public DoadorResponse criar(DoadorRequest req) {
        repository.findByEmailIgnoreCase(req.email().trim()).ifPresent(d -> {
            throw new RegraNegocioException("Já existe um doador com o e-mail " + d.getEmail());
        });
        Doador d = new Doador();
        aplicar(d, req);
        return DoadorResponse.de(repository.save(d));
    }

    @Transactional
    public DoadorResponse atualizar(Long id, DoadorRequest req) {
        Doador d = obter(id);
        aplicar(d, req);
        return DoadorResponse.de(repository.saveAndFlush(d));
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(obter(id));
    }

    @Transactional(readOnly = true)
    public Doador obter(Long id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Doador", id));
    }

    private static void aplicar(Doador d, DoadorRequest req) {
        d.setNome(req.nome().trim());
        d.setEmail(req.email().trim().toLowerCase());
        d.setTelefone(Textos.vazioParaNulo(req.telefone()));
        d.setCidade(Textos.vazioParaNulo(req.cidade()));
        d.setUf(Textos.ufOuNulo(req.uf()));
        d.setLatitude(req.latitude());
        d.setLongitude(req.longitude());
    }
}
