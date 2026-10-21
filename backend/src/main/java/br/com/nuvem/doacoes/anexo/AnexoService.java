package br.com.nuvem.doacoes.anexo;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nuvem.doacoes.anexo.Anexo.EntidadeTipo;
import br.com.nuvem.doacoes.anexo.AnexoDtos.AnexoResponse;
import br.com.nuvem.doacoes.anexo.AnexoDtos.SolicitacaoLogo;
import br.com.nuvem.doacoes.anexo.AnexoDtos.SolicitacaoUpload;
import br.com.nuvem.doacoes.anexo.AnexoDtos.UploadAutorizado;
import br.com.nuvem.doacoes.comum.RecursoNaoEncontradoException;
import br.com.nuvem.doacoes.comum.RegraNegocioException;
import br.com.nuvem.doacoes.doacao.DoacaoRepository;
import br.com.nuvem.doacoes.necessidade.NecessidadeRepository;
import br.com.nuvem.doacoes.ong.OngRepository;
import br.com.nuvem.doacoes.ong.OngService;

@Service
public class AnexoService {

    static final Set<String> TIPOS_PERMITIDOS = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf");

    private final AnexoRepository repository;
    private final ArmazenamentoService armazenamento;
    private final OngRepository ongs;
    private final NecessidadeRepository necessidades;
    private final DoacaoRepository doacoes;
    private final OngService ongService;

    AnexoService(AnexoRepository repository, ArmazenamentoService armazenamento, OngRepository ongs,
                 NecessidadeRepository necessidades, DoacaoRepository doacoes, OngService ongService) {
        this.repository = repository;
        this.armazenamento = armazenamento;
        this.ongs = ongs;
        this.necessidades = necessidades;
        this.doacoes = doacoes;
        this.ongService = ongService;
    }

    @Transactional
    public UploadAutorizado autorizarUpload(SolicitacaoUpload req) {
        validarEntidade(req.entidadeTipo(), req.entidadeId());
        return registrar(req.entidadeTipo(), req.entidadeId(), req.nomeArquivo(), req.contentType(), req.tamanhoBytes());
    }

    /** Logo da ONG: cria o anexo e já aponta ongs.logo_key para ele. */
    @Transactional
    public UploadAutorizado autorizarLogo(Long ongId, SolicitacaoLogo req) {
        if (!req.contentType().startsWith("image/")) {
            throw new RegraNegocioException("O logo precisa ser uma imagem.");
        }
        validarEntidade(EntidadeTipo.ONG, ongId);
        UploadAutorizado autorizado = registrar(EntidadeTipo.ONG, ongId, req.nomeArquivo(), req.contentType(),
                req.tamanhoBytes());
        ongService.definirLogo(ongId, autorizado.key());
        return autorizado;
    }

    @Transactional(readOnly = true)
    public List<AnexoResponse> listar(EntidadeTipo tipo, Long entidadeId) {
        return repository.findByEntidadeTipoAndEntidadeIdOrderByCriadoEmDesc(tipo, entidadeId)
                .stream().map(this::paraResponse).toList();
    }

    @Transactional(readOnly = true)
    public AnexoResponse buscar(Long id) {
        return paraResponse(obter(id));
    }

    @Transactional
    public void excluir(Long id) {
        Anexo a = obter(id);
        armazenamento.remover(a.getS3Key());
        armazenamento.remover(a.getThumbnailKey());
        repository.delete(a);
    }

    private UploadAutorizado registrar(EntidadeTipo tipo, Long entidadeId, String nomeArquivo, String contentType,
                                       Long tamanhoBytes) {
        String tipoNormalizado = contentType.toLowerCase().trim();
        if (!TIPOS_PERMITIDOS.contains(tipoNormalizado)) {
            throw new RegraNegocioException("Tipo de arquivo não suportado. Envie JPG, PNG, WEBP, GIF ou PDF.");
        }
        armazenamento.validarTamanho(tamanhoBytes);

        String prefixo = "uploads/" + tipo.name().toLowerCase() + "/" + entidadeId;
        var url = armazenamento.urlUpload(ArmazenamentoService.novaKey(prefixo, nomeArquivo), tipoNormalizado);

        Anexo a = new Anexo();
        a.setEntidadeTipo(tipo);
        a.setEntidadeId(entidadeId);
        a.setNomeOriginal(nomeArquivo);
        a.setS3Key(url.key());
        a.setContentType(tipoNormalizado);
        a.setTamanhoBytes(tamanhoBytes);
        repository.save(a);

        return new UploadAutorizado(a.getId(), url.url(), "PUT", url.contentType(), url.key(), url.expiraEm());
    }

    private void validarEntidade(EntidadeTipo tipo, Long id) {
        boolean existe = switch (tipo) {
            case ONG -> ongs.existsById(id);
            case NECESSIDADE -> necessidades.existsById(id);
            case DOACAO -> doacoes.existsById(id);
        };
        if (!existe) {
            throw new RecursoNaoEncontradoException(tipo.name(), id);
        }
    }

    private Anexo obter(Long id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Anexo", id));
    }

    private AnexoResponse paraResponse(Anexo a) {
        return new AnexoResponse(a.getId(), a.getEntidadeTipo(), a.getEntidadeId(), a.getNomeOriginal(),
                a.getContentType(), a.getTamanhoBytes(), a.getStatus(), a.getLargura(), a.getAltura(), a.getPaginas(),
                armazenamento.urlDownload(a.getS3Key()), armazenamento.urlDownload(a.getThumbnailKey()),
                a.getErro(), a.getProcessadoEm(), a.getCriadoEm());
    }
}
