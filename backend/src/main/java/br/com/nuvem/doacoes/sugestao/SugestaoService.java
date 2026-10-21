package br.com.nuvem.doacoes.sugestao;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nuvem.doacoes.anexo.ArmazenamentoService;
import br.com.nuvem.doacoes.comum.Geo;
import br.com.nuvem.doacoes.comum.Textos;
import br.com.nuvem.doacoes.necessidade.Necessidade;
import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;
import br.com.nuvem.doacoes.necessidade.NecessidadeRepository;

/**
 * "Match" doador → ONG. Para cada necessidade aberta da categoria pedida calcula
 * a distância (Haversine) e uma distância ajustada:
 *
 * <pre>
 *   ajustada = distanciaKm / (pesoUrgencia × (1 + 0,25 × fraçãoQueFalta))
 * </pre>
 *
 * Assim a instituição mais próxima vence, mas uma urgência alta ou uma meta
 * longe de ser atingida "puxa" a ONG para cima no ranking.
 */
@Service
public class SugestaoService {

    private static final Map<Urgencia, String> ROTULO_URGENCIA =
            Map.of(Urgencia.ALTA, "alta", Urgencia.MEDIA, "média", Urgencia.BAIXA, "baixa");

    private final NecessidadeRepository necessidades;
    private final ArmazenamentoService armazenamento;

    SugestaoService(NecessidadeRepository necessidades, ArmazenamentoService armazenamento) {
        this.necessidades = necessidades;
        this.armazenamento = armazenamento;
    }

    record Candidata(Necessidade necessidade, double distanciaKm, double ajustada) {
    }

    @Transactional(readOnly = true)
    public List<SugestaoResponse> sugerir(Categoria categoria, double lat, double lng, String termo,
                                          Double raioKm, int limite) {
        List<Candidata> ranking = necessidades.candidatas(categoria, Textos.vazioParaNulo(termo)).stream()
                .map(n -> avaliar(n, lat, lng))
                .filter(c -> raioKm == null || c.distanciaKm() <= raioKm)
                .sorted(Comparator.comparingDouble(Candidata::ajustada))
                .limit(Math.max(1, Math.min(limite, 50)))
                .toList();

        List<SugestaoResponse> resposta = new ArrayList<>();
        for (int i = 0; i < ranking.size(); i++) {
            resposta.add(paraResponse(ranking.get(i), i == 0));
        }
        return resposta;
    }

    static Candidata avaliar(Necessidade n, double lat, double lng) {
        double km = Geo.distanciaKm(lat, lng, n.getOng().getLatitude(), n.getOng().getLongitude());
        double fracaoFaltando = n.getQuantidade() == 0 ? 0 : (double) n.getFaltam() / n.getQuantidade();
        double fator = n.getUrgencia().peso * (1 + 0.25 * fracaoFaltando);
        return new Candidata(n, km, km / fator);
    }

    private SugestaoResponse paraResponse(Candidata c, boolean melhor) {
        Necessidade n = c.necessidade();
        var o = n.getOng();
        double km = Geo.arredondar(c.distanciaKm());
        String motivo = String.format(Locale.forLanguageTag("pt-BR"), "A %.1f km de você · urgência %s · faltam %d %s",
                km, ROTULO_URGENCIA.get(n.getUrgencia()), n.getFaltam(), n.getUnidade());
        return new SugestaoResponse(n.getId(), n.getTitulo(), n.getDescricao(), n.getCategoria(), n.getUrgencia(),
                n.getUnidade(), n.getQuantidade(), n.getQuantidadeRecebida(), n.getFaltam(),
                o.getId(), o.getNome(), o.getCidade(), o.getUf(), o.getEndereco(), armazenamento.urlDownload(o.getLogoKey()),
                o.getLatitude(), o.getLongitude(), km, Geo.arredondar(c.ajustada()), melhor, motivo);
    }
}
