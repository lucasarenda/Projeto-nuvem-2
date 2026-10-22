package br.com.nuvem.doacoes.doador;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoadorRepository extends JpaRepository<Doador, Long> {

    Optional<Doador> findByEmailIgnoreCase(String email);

    @Query("""
            select d from Doador d
            where (:termo = ''
                   or lower(d.nome) like lower(concat('%', :termo, '%'))
                   or lower(d.email) like lower(concat('%', :termo, '%')))
            order by d.nome
            """)
    List<Doador> buscar(@Param("termo") String termo);
}
