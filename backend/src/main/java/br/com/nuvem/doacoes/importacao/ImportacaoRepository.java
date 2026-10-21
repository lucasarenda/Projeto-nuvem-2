package br.com.nuvem.doacoes.importacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ImportacaoRepository extends JpaRepository<Importacao, Long> {

    List<Importacao> findByOngIdOrderByCriadoEmDesc(Long ongId);
}
