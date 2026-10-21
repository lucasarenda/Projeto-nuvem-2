package br.com.nuvem.doacoes.ong;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nuvem.doacoes.anexo.ArmazenamentoService;
import br.com.nuvem.doacoes.comum.RecursoNaoEncontradoException;
import br.com.nuvem.doacoes.comum.Textos;
import br.com.nuvem.doacoes.necessidade.NecessidadeRepository;

@Service
public class OngService {

    private final OngRepository repository;
    private final NecessidadeRepository necessidades;
    private final ArmazenamentoService armazenamento;

    OngService(OngRepository repository, NecessidadeRepository necessidades, ArmazenamentoService armazenamento) {
        this.repository = repository;
        this.necessidades = necessidades;
        this.armazenamento = armazenamento;
    }

    @Transactional(readOnly = true)
    public List<OngResponse> listar(String termo, String uf) {
        List<Ong> ongs = repository.buscar(Textos.vazioParaNulo(termo), Textos.ufOuNulo(uf));
        Map<Long, Long> abertas = necessidades.contarAbertasPorOng();
        return ongs.stream().map(o -> paraResponse(o, abertas.getOrDefault(o.getId(), 0L))).toList();
    }

    @Transactional(readOnly = true)
    public OngResponse buscar(Long id) {
        return paraResponse(obter(id), necessidades.contarAbertasDaOng(id));
    }

    @Transactional
    public OngResponse criar(OngRequest req) {
        Ong ong = new Ong();
        aplicar(ong, req);
        return paraResponse(repository.save(ong), 0);
    }

    @Transactional
    public OngResponse atualizar(Long id, OngRequest req) {
        Ong ong = obter(id);
        aplicar(ong, req);
        return paraResponse(repository.saveAndFlush(ong), necessidades.contarAbertasDaOng(id));
    }

    @Transactional
    public void excluir(Long id) {
        repository.delete(obter(id));
    }

    @Transactional
    public void definirLogo(Long id, String s3Key) {
        obter(id).setLogoKey(s3Key);
    }

    @Transactional(readOnly = true)
    public Ong obter(Long id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("ONG", id));
    }

    private OngResponse paraResponse(Ong o, long abertas) {
        return new OngResponse(o.getId(), o.getNome(), o.getCnpj(), o.getEmail(), o.getTelefone(), o.getDescricao(),
                o.getEndereco(), o.getCidade(), o.getUf(), o.getLatitude(), o.getLongitude(),
                armazenamento.urlDownload(o.getLogoKey()), abertas, o.getCriadoEm(), o.getAtualizadoEm());
    }

    private static void aplicar(Ong ong, OngRequest req) {
        ong.setNome(req.nome().trim());
        ong.setCnpj(Textos.vazioParaNulo(req.cnpj()));
        ong.setEmail(req.email().trim().toLowerCase());
        ong.setTelefone(Textos.vazioParaNulo(req.telefone()));
        ong.setDescricao(Textos.vazioParaNulo(req.descricao()));
        ong.setEndereco(Textos.vazioParaNulo(req.endereco()));
        ong.setCidade(req.cidade().trim());
        ong.setUf(req.uf().toUpperCase());
        ong.setLatitude(req.latitude());
        ong.setLongitude(req.longitude());
    }
}
