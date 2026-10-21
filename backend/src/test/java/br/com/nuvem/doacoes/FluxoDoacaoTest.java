package br.com.nuvem.doacoes;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

/** Percorre o fluxo principal: ONG → necessidade → doador → sugestão → doação → entrega. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FluxoDoacaoTest {

    @Autowired
    MockMvc mvc;

    @Test
    void fluxoCompletoDeDoacao() throws Exception {
        long ongPerto = criar("/api/ongs", """
                {"nome":"ONG Perto","email":"perto@ong.org","cidade":"São Paulo","uf":"sp",
                 "latitude":-23.5505,"longitude":-46.6333}
                """);
        long ongLonge = criar("/api/ongs", """
                {"nome":"ONG Longe","email":"longe@ong.org","cidade":"Campinas","uf":"SP",
                 "latitude":-22.9056,"longitude":-47.0608}
                """);

        long necPerto = criar("/api/necessidades", """
                {"ongId":%d,"titulo":"Casacos","categoria":"ROUPA","quantidade":10,"unidade":"peças","urgencia":"MEDIA"}
                """.formatted(ongPerto));
        criar("/api/necessidades", """
                {"ongId":%d,"titulo":"Moletons","categoria":"ROUPA","quantidade":10,"unidade":"peças","urgencia":"ALTA"}
                """.formatted(ongLonge));
        criar("/api/necessidades", """
                {"ongId":%d,"titulo":"Arroz","categoria":"ALIMENTO","quantidade":10,"unidade":"kg","urgencia":"ALTA"}
                """.formatted(ongPerto));

        // Doador na Av. Paulista: a ONG do centro de SP deve ser o melhor match para ROUPA
        mvc.perform(get("/api/sugestoes").param("categoria", "ROUPA").param("lat", "-23.5614").param("lng", "-46.6559"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].ongNome").value("ONG Perto"))
                .andExpect(jsonPath("$[0].melhorMatch").value(true))
                .andExpect(jsonPath("$[1].ongNome").value("ONG Longe"));

        long doador = criar("/api/doadores", """
                {"nome":"Ana","email":"ana@teste.com","latitude":-23.5614,"longitude":-46.6559}
                """);
        long doacao = criar("/api/doacoes", """
                {"doadorId":%d,"necessidadeId":%d,"descricao":"10 casacos","quantidade":10}
                """.formatted(doador, necPerto));

        mvc.perform(patch("/api/doacoes/{id}/status", doacao).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ENTREGUE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENTREGUE"));

        mvc.perform(get("/api/necessidades/{id}", necPerto))
                .andExpect(jsonPath("$.quantidadeRecebida").value(10))
                .andExpect(jsonPath("$.status").value("ATENDIDA"));

        // Entregue não volta para pendente
        mvc.perform(patch("/api/doacoes/{id}/status", doacao).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PENDENTE\"}"))
                .andExpect(status().isUnprocessableContent());

        mvc.perform(get("/api/ongs").param("uf", "SP"))
                .andExpect(jsonPath("$", hasSize(2)));

        mvc.perform(put("/api/doadores/{id}", doador).contentType(MediaType.APPLICATION_JSON).content("""
                        {"nome":"Ana Souza","email":"ana@teste.com"}
                        """))
                .andExpect(jsonPath("$.nome").value("Ana Souza"));

        mvc.perform(delete("/api/ongs/{id}", ongLonge)).andExpect(status().isNoContent());
        mvc.perform(get("/api/ongs/{id}", ongLonge)).andExpect(status().isNotFound());
    }

    @Test
    void validaCamposObrigatorios() throws Exception {
        mvc.perform(post("/api/ongs").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.latitude").exists());
    }

    @Test
    void uploadSemBucketConfiguradoRetornaErroClaro() throws Exception {
        long ong = criar("/api/ongs", """
                {"nome":"ONG Upload","email":"up@ong.org","cidade":"Recife","uf":"PE","latitude":-8.05,"longitude":-34.88}
                """);
        mvc.perform(post("/api/anexos/upload-url").contentType(MediaType.APPLICATION_JSON).content("""
                        {"entidadeTipo":"ONG","entidadeId":%d,"nomeArquivo":"foto.png","contentType":"image/png","tamanhoBytes":1000}
                        """.formatted(ong)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("S3_BUCKET")));
    }

    private long criar(String url, String json) throws Exception {
        String body = mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }
}
