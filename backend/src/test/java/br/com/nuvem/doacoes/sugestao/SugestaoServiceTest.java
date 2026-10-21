package br.com.nuvem.doacoes.sugestao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import br.com.nuvem.doacoes.comum.Geo;
import br.com.nuvem.doacoes.necessidade.Necessidade;
import br.com.nuvem.doacoes.necessidade.Necessidade.Urgencia;
import br.com.nuvem.doacoes.ong.Ong;

class SugestaoServiceTest {

    @Test
    void distanciaSaoPauloRioAproximadamente360km() {
        double km = Geo.distanciaKm(-23.5505, -46.6333, -22.9068, -43.1729);
        assertThat(km).isCloseTo(360, within(10.0));
    }

    @Test
    void urgenciaAltaAproximaOngNoRanking() {
        Necessidade media = necessidade(Urgencia.MEDIA, -23.60, -46.63);  // ~5,5 km
        Necessidade alta = necessidade(Urgencia.ALTA, -23.61, -46.63);    // ~6,7 km

        var cMedia = SugestaoService.avaliar(media, -23.55, -46.63);
        var cAlta = SugestaoService.avaliar(alta, -23.55, -46.63);

        assertThat(cAlta.distanciaKm()).isGreaterThan(cMedia.distanciaKm());
        assertThat(cAlta.ajustada()).isLessThan(cMedia.ajustada());
    }

    private static Necessidade necessidade(Urgencia urgencia, double lat, double lng) {
        Ong ong = new Ong();
        ong.setLatitude(lat);
        ong.setLongitude(lng);
        Necessidade n = new Necessidade();
        n.setOng(ong);
        n.setUrgencia(urgencia);
        n.setQuantidade(10);
        n.setQuantidadeRecebida(0);
        return n;
    }
}
