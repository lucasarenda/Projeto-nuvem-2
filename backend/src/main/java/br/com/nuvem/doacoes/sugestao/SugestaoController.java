package br.com.nuvem.doacoes.sugestao;

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nuvem.doacoes.necessidade.Necessidade.Categoria;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

@RestController
@Validated
@RequestMapping("/api/sugestoes")
public class SugestaoController {

    private final SugestaoService service;

    SugestaoController(SugestaoService service) {
        this.service = service;
    }

    /** Ex.: GET /api/sugestoes?categoria=ROUPA&lat=-23.55&lng=-46.63&limite=6 */
    @GetMapping
    List<SugestaoResponse> sugerir(@RequestParam(required = false) Categoria categoria,
                                   @RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
                                   @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng,
                                   @RequestParam(required = false) String termo,
                                   @RequestParam(required = false) Double raioKm,
                                   @RequestParam(defaultValue = "6") int limite) {
        return service.sugerir(categoria, lat, lng, termo, raioKm, limite);
    }
}
