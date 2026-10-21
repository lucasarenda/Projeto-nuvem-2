package br.com.nuvem.doacoes.anexo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.nuvem.doacoes.anexo.Anexo.EntidadeTipo;

public interface AnexoRepository extends JpaRepository<Anexo, Long> {

    List<Anexo> findByEntidadeTipoAndEntidadeIdOrderByCriadoEmDesc(EntidadeTipo tipo, Long entidadeId);
}
