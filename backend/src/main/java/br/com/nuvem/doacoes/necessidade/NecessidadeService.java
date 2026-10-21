package br.com.nuvem.doacoes.necessidade;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nuvem.doacoes.comum.RecursoNaoEncontradoException;
import br.com.nuvem.doacoes.comum.Textos;
import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import br.com.nuvem.doacoes.necessidade.Necessidade.Status;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;
import br.com.nuvem.doacoes.ong.OngService;

@Service
public class NecessidadeService {

    private final NecessidadeRepository repository;
    private final OngService ongs;

    NecessidadeService(NecessidadeRepository repository, OngService ongs) {
        this.repository = repository;
        this.ongs = ongs;
    }

    @Transactional(readOnly = true)
    public List<NecessidadeResponse> listar(Long ongId, Categoria categoria, Urgencia urgencia, Status status,
                                            String uf, String termo) {
        // Mais urgentes primeiro; dentro da mesma urgência, as mais recentes (a consulta já vem por data).
        return repository.buscar(ongId, categoria, urgencia, status, Textos.ufOuNulo(uf), Textos.vazioParaNulo(termo))
                .stream()
                .sorted(Comparator.comparing(Necessidade::getUrgencia).reversed())
                .map(NecessidadeResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public NecessidadeResponse buscar(Long id) {
        return NecessidadeResponse.de(obter(id));
    }

    @Transactional
    public NecessidadeResponse criar(NecessidadeRequest req) {
        Necessidade n = new Necessidade();
        aplicar(n, req);
        return NecessidadeResponse.de(repository.save(n));
    }

    @Transactional
    public NecessidadeResponse atualizar(Long id, NecessidadeRequest req) {
        Necessidade n = obter(id);
        aplicar(n, req);
        return NecessidadeResponse.de(repository.saveAndFlush(n));
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(obter(id));
    }

    @Transactional(readOnly = true)
    public Necessidade obter(Long id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Necessidade", id));
    }

    private void aplicar(Necessidade n, NecessidadeRequest req) {
        n.setOng(ongs.obter(req.ongId()));
        n.setTitulo(req.titulo().trim());
        n.setDescricao(Textos.vazioParaNulo(req.descricao()));
        n.setCategoria(req.categoria());
        n.setQuantidade(req.quantidade());
        n.setUnidade(req.unidade().trim());
        n.setUrgencia(req.urgencia());
        if (req.status() != null) {
            n.setStatus(req.status());
        }
    }
}
