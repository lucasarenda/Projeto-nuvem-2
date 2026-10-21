package br.com.nuvem.doacoes.doacao;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nuvem.doacoes.comum.Geo;
import br.com.nuvem.doacoes.comum.RecursoNaoEncontradoException;
import br.com.nuvem.doacoes.comum.RegraNegocioException;
import br.com.nuvem.doacoes.comum.Textos;
import br.com.nuvem.doacoes.doacao.Doacao.Status;
import br.com.nuvem.doacoes.doador.Doador;
import br.com.nuvem.doacoes.doador.DoadorService;
import br.com.nuvem.doacoes.necessidade.Necessidade;
import br.com.nuvem.doacoes.necessidade.NecessidadeService;

@Service
public class DoacaoService {

    private final DoacaoRepository repository;
    private final DoadorService doadores;
    private final NecessidadeService necessidades;

    DoacaoService(DoacaoRepository repository, DoadorService doadores, NecessidadeService necessidades) {
        this.repository = repository;
        this.doadores = doadores;
        this.necessidades = necessidades;
    }

    @Transactional(readOnly = true)
    public List<DoacaoResponse> listar(Long doadorId, Long ongId, Long necessidadeId, Status status) {
        return repository.buscar(doadorId, ongId, necessidadeId, status).stream().map(DoacaoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public DoacaoResponse buscar(Long id) {
        return DoacaoResponse.de(obter(id));
    }

    @Transactional
    public DoacaoResponse criar(DoacaoRequest req) {
        Necessidade necessidade = necessidades.obter(req.necessidadeId());
        if (necessidade.getStatus() != Necessidade.Status.ABERTA) {
            throw new RegraNegocioException("Esta necessidade não está mais aberta para doações.");
        }
        Doacao d = new Doacao();
        d.setDoador(doadores.obter(req.doadorId()));
        d.setNecessidade(necessidade);
        d.setDescricao(req.descricao().trim());
        d.setQuantidade(req.quantidade());
        d.setObservacao(Textos.vazioParaNulo(req.observacao()));
        d.setDistanciaKm(distancia(d.getDoador(), necessidade));
        return DoacaoResponse.de(repository.save(d));
    }

    /** Atualiza descrição/quantidade/observação. Só é permitido enquanto a doação não foi concluída. */
    @Transactional
    public DoacaoResponse atualizar(Long id, DoacaoRequest req) {
        Doacao d = obter(id);
        if (d.getStatus() == Status.ENTREGUE || d.getStatus() == Status.CANCELADA) {
            throw new RegraNegocioException("Doações entregues ou canceladas não podem ser editadas.");
        }
        if (!d.getNecessidade().getId().equals(req.necessidadeId())) {
            Necessidade nova = necessidades.obter(req.necessidadeId());
            d.setNecessidade(nova);
        }
        if (!d.getDoador().getId().equals(req.doadorId())) {
            d.setDoador(doadores.obter(req.doadorId()));
        }
        d.setDescricao(req.descricao().trim());
        d.setQuantidade(req.quantidade());
        d.setObservacao(Textos.vazioParaNulo(req.observacao()));
        d.setDistanciaKm(distancia(d.getDoador(), d.getNecessidade()));
        return DoacaoResponse.de(repository.saveAndFlush(d));
    }

    @Transactional
    public DoacaoResponse alterarStatus(Long id, StatusDoacaoRequest req) {
        Doacao d = obter(id);
        if (d.getStatus() == req.status()) {
            return DoacaoResponse.de(d);
        }
        if (!d.getStatus().podeIrPara(req.status())) {
            throw new RegraNegocioException("Não é possível mudar de " + d.getStatus() + " para " + req.status() + ".");
        }
        d.setStatus(req.status());
        if (req.observacao() != null) {
            d.setObservacao(Textos.vazioParaNulo(req.observacao()));
        }
        if (req.status() == Status.ENTREGUE) {
            d.getNecessidade().registrarRecebimento(d.getQuantidade());
        }
        return DoacaoResponse.de(repository.saveAndFlush(d));
    }

    @Transactional
    public void excluir(Long id) {
        Doacao d = obter(id);
        if (d.getStatus() == Status.ENTREGUE) {
            d.getNecessidade().estornarRecebimento(d.getQuantidade());
        }
        repository.delete(d);
    }

    private Doacao obter(Long id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Doação", id));
    }

    private static BigDecimal distancia(Doador doador, Necessidade n) {
        if (!doador.temLocalizacao()) {
            return null;
        }
        double km = Geo.distanciaKm(doador.getLatitude(), doador.getLongitude(),
                n.getOng().getLatitude(), n.getOng().getLongitude());
        return BigDecimal.valueOf(km).setScale(2, RoundingMode.HALF_UP);
    }
}
